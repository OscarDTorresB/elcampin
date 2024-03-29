import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Drawer, Button, Modal } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { BarnsType, CreateBarnType } from 'src/utils/types';
import { createANewBarn, deleteABarn, updateABarn } from 'src/utils/api/barns';
import barnHooks from 'src/hooks/barnHooks';
import useBarnsContext from 'src/hooks/useBarnsContext';
import { getNumberInputRules } from 'src/utils/barnUtils';
import ControlledInput from './ControlledInput';
import AlertBar from './AlertBar';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '40vw',
    maxWidth: '28rem',
    minWidth: '20rem',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(4),
    '& > *': {
      marginBottom: theme.spacing(2),
    },
  },
  input: {
    width: '100%',
  },
  modal: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alert: {
    width: '80%',
    maxWidth: `${600 / 16}rem`,
  },
}));

interface BarnDrawerProps {
  open: boolean;
  onClose: () => void;
  barnToEdit?: BarnsType;
}

function BarnDrawer({ open, onClose, barnToEdit }: BarnDrawerProps): JSX.Element {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { validateNewBarnNumber, findNextBarnNumber } = barnHooks();
  const { refreshState } = useBarnsContext();
  const { control, handleSubmit, watch } = useForm<CreateBarnType>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });
  const maxCapacityValue = watch('maxCapacity');
  const isEditing = Boolean(barnToEdit);
  const defaultValues: CreateBarnType = {
    barnNumber: barnToEdit?.barnNumber || findNextBarnNumber(),
    chickensInIt: barnToEdit?.chickensInIt || 0,
    maxCapacity: barnToEdit?.maxCapacity || 0,
  };

  const handleOnClose = () => {
    refreshState();
    onClose();
  };

  const barnNumberRules = getNumberInputRules({
    validateFunctions: {
      validateNewBarnNumber: isEditing ? () => true : validateNewBarnNumber,
    },
    requiredMessage: 'Es necesario asignarle un número al galpon',
  });

  const maxCapacityRules = getNumberInputRules({
    requiredMessage: 'Es necesario asignar la capacidad maxima de gallinas al galpon',
    validateFunctions: {
      moreThanOneChicken: (value) => Number(value) > 0,
    },
  });

  const chickensInItRules = getNumberInputRules({
    requiredMessage: 'Especifica la cantidad de gallinas que hay en el galpon',
    validateFunctions: {
      noExceedCapacity: (value) => {
        const numberOfChickens = Number(value);
        const isANumber = !Number.isNaN(numberOfChickens);

        return isANumber && numberOfChickens <= (maxCapacityValue || defaultValues.maxCapacity);
      },
    },
  });

  const handleCloseNotificationBar = () => {
    setAlertMessage('');
    setIsLoading(false);
    handleOnClose();
  };

  const handleDeleteBarn = async () => {
    try {
      setIsLoading(true);
      if (barnToEdit) {
        const barnDeleted = await deleteABarn(barnToEdit.id);
        setAlertMessage('Galpon eliminado exitosamente.');
        return barnDeleted;
      }
      throw Error('An error ocurred deleting the barn');
    } catch (error) {
      // console.error(error);
      return null;
    }
  };

  const onSubmit: SubmitHandler<CreateBarnType> = async (barnToCreateOrUpdate) => {
    try {
      setIsLoading(true);
      const barnCreatedOrUpdated = (isEditing && barnToEdit)
        ? await updateABarn(barnToEdit.id, barnToCreateOrUpdate)
        : await createANewBarn(barnToCreateOrUpdate);

      setAlertMessage('Galpon editado exitosamente.');
      return barnCreatedOrUpdated;
    } catch (error) {
      // alert(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={handleOnClose} anchor="right">
      <form className={classes.root} onSubmit={handleSubmit(onSubmit)}>
        <ControlledInput
          name="barnNumber"
          control={control}
          className={classes.input}
          defaultValue={defaultValues.barnNumber}
          label="Número del galpon"
          rules={barnNumberRules}
          type="number"
          variant="outlined"
          defaultErrorMessage="Ya existe un galpon con ese número"
          disabled={isEditing}
        />
        <ControlledInput
          name="maxCapacity"
          control={control}
          className={classes.input}
          defaultValue={defaultValues.maxCapacity}
          label="Capacidad maxima del galpon"
          rules={maxCapacityRules}
          type="number"
          variant="outlined"
          defaultErrorMessage="Solo es aceptado números positivos y sin caracteres distintos a números"
        />
        <ControlledInput
          name="chickensInIt"
          control={control}
          className={classes.input}
          defaultValue={defaultValues.chickensInIt}
          label="Gallinas en el galpon"
          rules={chickensInItRules}
          type="number"
          variant="outlined"
          defaultErrorMessage="Solo números y que no excedan la capacidad maxima del galpon"
        />
        <Button type="submit" disabled={isLoading} variant="contained" color="secondary">
          {isEditing ? 'Editar galpon' : 'Crear galpon nuevo'}
        </Button>
        {isEditing && (
          <Button type="button" disabled={isLoading} variant="contained" color="primary" onClick={handleDeleteBarn}>
            Eliminar este galpon
          </Button>
        )}
      </form>
      <Modal
        className={classes.modal}
        open={Boolean(alertMessage)}
        onClose={handleCloseNotificationBar}
      >
        <AlertBar title="Cambio exitoso" externalClass={classes.alert} severity="success" onClose={handleCloseNotificationBar}>
          {alertMessage}
        </AlertBar>
      </Modal>
    </Drawer>
  );
}

export default BarnDrawer;
